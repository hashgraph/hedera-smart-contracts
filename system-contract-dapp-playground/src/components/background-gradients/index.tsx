/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const BgGradient = () => {
  return (
    <div className="bg-white 2xl:max-w-[100rem] 2xl:mx-auto">
      <div className="gradient-01 absolute -top-40 -left-16 -z-10" />
      <div className="gradient-02 absolute -top-40 -left-32 -z-10" />
      <div className="gradient-03 absolute -top-[23rem] right-64 -z-10" />
      <div className="gradient-04 -z-10" />
    </div>
  );
};

export default BgGradient;
